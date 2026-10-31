# SKYCAST — AWS Multi-Instance Production Deployment Guide

This guide details the complete, step-by-step instructions to deploy **SKYCAST** on Amazon Web Services (AWS) using an **Application Load Balancer (ALB)**, **Auto Scaling Group (ASG)**, **Dual Multi-AZ EC2 Instances**, **Nginx + Gunicorn**, and optional **DynamoDB** and **CloudWatch** integration.

---

> [!WARNING]
> ### AWS Cost Warning & Resource Cleanup Advisory
> AWS services (Application Load Balancer hourly running fees, Public IPv4 address allocation charges, NAT Gateways, and CloudWatch custom metrics) can incur real charges even on accounts within the AWS Free Tier.
> - **ALB** charges approximately ~$0.0225 per hour (~$16/month) plus LCU usage.
> - **Public IPv4** charges $0.005 per hour per IP.
> 
> **Always execute the teardown steps at the bottom of this document immediately following your college viva demonstration.**

---

## 1. Architecture Summary

```
                      INTERNET / CLIENTS
                              │
                              ▼
                 APPLICATION LOAD BALANCER (ALB)
                   (Public Subnet ap-south-1a/b)
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        TARGET GROUP (Port 80)      TARGET GROUP (Port 80)
      Health Check: /api/health   Health Check: /api/health
                │                           │
                ▼                           ▼
      EC2 INSTANCE 1 (Node A)      EC2 INSTANCE 2 (Node B)
       Zone: ap-south-1a            Zone: ap-south-1b
       Nginx ──► Gunicorn ──► Flask Nginx ──► Gunicorn ──► Flask
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
             OUTBOUND: Open-Meteo REST API
             STORAGE: Amazon DynamoDB (Optional)
             MONITORING: Amazon CloudWatch
```

---

## 2. Prerequisites

1. An active AWS Account.
2. IAM User with Administrator or EC2/VPC/ALB permissions.
3. AWS CLI configured locally (`aws configure`) or use the AWS Management Console.
4. SSH Key Pair generated in your target region (e.g., `skycast-key-pair.pem` in `ap-south-1`).

---

## 3. Step 1: Network & Security Group Setup

### 3.1 VPC & Subnets
Use your Default VPC or create a custom VPC with at least two subnets in different Availability Zones:
- **Subnet 1**: `ap-south-1a` (e.g., CIDR `172.31.0.0/20`)
- **Subnet 2**: `ap-south-1b` (e.g., CIDR `172.31.16.0/20`)

### 3.2 Security Groups

#### A. Load Balancer Security Group (`skycast-alb-sg`)
| Type | Protocol | Port Range | Source | Description |
| :--- | :--- | :--- | :--- | :--- |
| Inbound | HTTP | 80 | `0.0.0.0/0` | Public Web Traffic |
| Inbound | HTTPS | 443 | `0.0.0.0/0` | Secure SSL Traffic |
| Outbound | All | All | `0.0.0.0/0` | Forward to Target Group |

#### B. EC2 Instances Security Group (`skycast-ec2-sg`)
| Type | Protocol | Port Range | Source | Description |
| :--- | :--- | :--- | :--- | :--- |
| Inbound | HTTP | 80 | `skycast-alb-sg` ID | **Crucial:** Only allow traffic from ALB |
| Inbound | SSH | 22 | Your Public IP | Administrator Remote Shell |
| Outbound | All | All | `0.0.0.0/0` | Outbound API queries to Open-Meteo |

---

## 4. Step 2: Launch EC2 Application Instances

Launch two identical instances or configure a Launch Template.

1. **AMI**: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type (64-bit x86).
2. **Instance Type**: `t3.micro` (Free Tier eligible).
3. **Network**: Default VPC.
   - Instance 1: Place in Subnet `ap-south-1a`.
   - Instance 2: Place in Subnet `ap-south-1b`.
4. **Security Group**: Select `skycast-ec2-sg`.
5. **IAM Role**: Attach an IAM role with `CloudWatchAgentServerPolicy` and `AmazonDynamoDBFullAccess` (if DynamoDB is enabled).
6. **Advanced Details — Metadata Service (IMDSv2)**:
   - **Metadata version**: Set to **V2 only (token required)**.
   - **Metadata response hop limit**: `2` (needed for container/proxy traversal).
7. **User Data**: Paste the contents of `aws/ec2-setup.sh`.

---

## 5. Step 3: Application Load Balancer & Target Group

### 5.1 Create Target Group
1. In the EC2 Console, navigate to **Target Groups** ➔ **Create Target Group**.
2. **Target type**: Instances.
3. **Target group name**: `skycast-tg`.
4. **Protocol**: HTTP, **Port**: 80.
5. **Health Checks**:
   - **Health check protocol**: HTTP
   - **Health check path**: `/api/health`
   - **Healthy threshold**: `2`
   - **Unhealthy threshold**: `3`
   - **Timeout**: `5` seconds
   - **Interval**: `15` seconds
   - **Success codes**: `200`
6. Click **Next**, select both EC2 instances, click **Include as pending below**, and click **Create Target Group**.

### 5.2 Create Application Load Balancer
1. Navigate to **Load Balancers** ➔ **Create Load Balancer**.
2. Select **Application Load Balancer** (ALB).
3. **Name**: `skycast-alb`.
4. **Scheme**: Internet-facing.
5. **IP address type**: IPv4.
6. **Network mapping**: Select your VPC and check both Availability Zones (`ap-south-1a` and `ap-south-1b`).
7. **Security Groups**: Select `skycast-alb-sg`.
8. **Listeners and Routing**:
   - Protocol: HTTP, Port: 80 ➔ Forward to `skycast-tg`.
9. Click **Create Load Balancer**.
10. Note the **DNS Name** (e.g. `skycast-alb-123456789.ap-south-1.elb.amazonaws.com`).

---

## 6. Step 4: Auto Scaling Group (ASG) Setup

1. In EC2 Console, navigate to **Launch Templates** ➔ **Create Launch Template**.
   - Name: `skycast-launch-template`.
   - Specify Ubuntu 22.04 LTS, `t3.micro`, Key Pair, `skycast-ec2-sg`, and the User Data script.
2. Navigate to **Auto Scaling Groups** ➔ **Create Auto Scaling Group**.
   - Name: `skycast-asg`.
   - Launch Template: `skycast-launch-template`.
   - Subnets: Select both `ap-south-1a` and `ap-south-1b`.
3. **Load Balancing**:
   - Attach to an existing load balancer ➔ Choose `skycast-tg`.
   - Turn on **Elastic Load Balancing health checks**.
4. **Group Size & Scaling Policies**:
   - Desired capacity: `2`
   - Minimum capacity: `2`
   - Maximum capacity: `4`
5. **Scaling Policy**:
   - Target tracking scaling policy: Average CPU utilization at `70%`.
6. Complete creation.

---

## 7. Step 5: Optional Amazon DynamoDB Integration

To persist search history globally across all instances:

1. In the AWS DynamoDB Console, click **Create Table**.
2. **Table name**: `SkycastSearchHistory`.
3. **Partition key**: `id` (Type: `String`).
4. **Table class**: DynamoDB Standard.
5. **Capacity mode**: On-demand (Pay-per-request).
6. Click **Create Table**.
7. In `/var/www/skycast/.env` on the instances, add:
   ```env
   ENABLE_DYNAMODB=1
   AWS_REGION=ap-south-1
   DYNAMODB_TABLE=SkycastSearchHistory
   ```
8. Restart service: `sudo systemctl restart skycast`.

---

## 8. Verification & Demonstration Steps

1. Open the ALB DNS name in your browser: `http://<your-alb-dns-name>`.
2. Notice the host card displays the verified EC2 **Instance ID** and **Availability Zone** (e.g., `i-0123456789abcdef0` in `ap-south-1a`).
3. Refresh the page or click **Simulate ALB Request Routing** in the **AWS Infrastructure** tab.
4. If requests balance across instances, you will see the active instance switch between nodes!
5. Test the health endpoint: `http://<your-alb-dns-name>/api/health`.

---

## 9. Post-Demonstration Cleanup (Crucial to Avoid Charges)

Run these cleanup commands or delete the resources in the AWS Console immediately:

```bash
# 1. Delete Auto Scaling Group
aws autoscaling delete-auto-scaling-group --auto-scaling-group-name skycast-asg --force-delete

# 2. Delete Application Load Balancer
aws elbv2 delete-load-balancer --load-balancer-arn <YOUR_ALB_ARN>

# 3. Delete Target Group
aws elbv2 delete-target-group --target-group-arn <YOUR_TG_ARN>

# 4. Terminate EC2 Instances
aws ec2 terminate-instances --instance-ids i-xxxxxxxxx i-yyyyyyyyy

# 5. Delete DynamoDB Table (if created)
aws dynamodb delete-table --table-name SkycastSearchHistory
```
