# SkyCast - AWS Cloud Resources

## 1. Amazon EC2

We deployed the SkyCast weather monitoring application using two AWS EC2 instances.

### Instance 1
- Name: SkyCast-Weather-Server
- Instance ID: i-0bff3ae07aa5e58f0
- Region: ap-southeast-2 (Sydney)
- Operating System: Ubuntu
- Instance Type: t3.micro
- Public IP: 3.107.94.241

### Instance 2
- Name: SkyCast-Weather-Server-2
- Purpose: Hosts the same SkyCast application using the configuration of the first instance.
- Created using the SkyCast AMI.

Note: Both instances run independently. An Application Load Balancer is not configured.

## 2. Amazon S3

- Bucket Name: skycast-weather-1
- Region: ap-southeast-2 (Sydney)
- Purpose: Stores the SkyCast project ZIP file.
- Usage: A temporary presigned URL was used to download the project onto the EC2 server.

## 3. Amazon Machine Image (AMI)

- Name: SkyCast-AMI-v1
- AMI ID: ami-00b915f72b7e58a3e
- Purpose: Used to launch the second EC2 instance with the same server configuration.

## 4. Security Group

- Name: SkyCast-Web-SG
- Security Group ID: sg-0eab870342bc17e4f
- HTTP: TCP port 80, accessible publicly.
- SSH: TCP port 22, restricted to the administrator's IP address.

## 5. Software and Server Configuration

- Ubuntu Linux
- Python
- Flask
- Gunicorn
- Nginx
- systemd

## 6. Deployment Workflow

1. Uploaded the project ZIP file to Amazon S3.
2. Launched the first EC2 instance.
3. Connected using SSH.
4. Downloaded and extracted the project from S3.
5. Installed application dependencies.
6. Configured Gunicorn and Nginx.
7. Created an AMI from the first EC2 instance.
8. Launched the second EC2 instance using the AMI.
9. Tested both application instances.

## 7. Important Notes

- Both EC2 instances independently host the SkyCast application.
- No Application Load Balancer or automatic traffic distribution is configured.
- AWS credentials, private keys and presigned URLs must never be committed to GitHub.
