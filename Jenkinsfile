pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        AWS_DEFAULT_REGION = 'us-east-1'
        AWS_REGION = 'us-east-1'
        AWS_ACCOUNT_ID = '569103038072'
        ECR_REGISTRY = '569103038072.dkr.ecr.us-east-1.amazonaws.com'
        EC2_INSTANCE_ID = 'i-02821d1a15040897d'
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo 'Checking out source code from GitHub'
                checkout scm

                bat 'git --version'
                bat 'dir'
            }
        }

        stage('Build') {
            steps {
                echo 'Installing dependencies'

                bat 'cd /d user-service && npm.cmd install'
                bat 'cd /d product-service && npm.cmd install'
                bat 'cd /d order-service && npm.cmd install'
            }
        }

        stage('Test') {
            steps {
                echo 'Running microservices tests'

                bat 'cd /d user-service && npm.cmd test'
                bat 'cd /d product-service && npm.cmd test'
                bat 'cd /d order-service && npm.cmd test'
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building Docker images'

                bat 'docker build -t %ECR_REGISTRY%/user-service:1.0 user-service'
                bat 'docker build -t %ECR_REGISTRY%/product-service:1.0 product-service'
                bat 'docker build -t %ECR_REGISTRY%/order-service:1.0 order-service'

                bat 'docker images'
            }
        }

        stage('Push Images to ECR') {
            steps {
                echo 'Authenticating with AWS and pushing images to ECR'

                withCredentials([
                    usernamePassword(
                        credentialsId: 'aws-jenkins-credentials',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
                ]) {
                    bat '''
                        @echo off

                        aws sts get-caller-identity
                        if errorlevel 1 exit /b 1

                        aws ecr get-login-password --region %AWS_DEFAULT_REGION% | docker login --username AWS --password-stdin %ECR_REGISTRY%
                        if errorlevel 1 exit /b 1

                        docker push %ECR_REGISTRY%/user-service:1.0
                        if errorlevel 1 exit /b 1

                        docker push %ECR_REGISTRY%/product-service:1.0
                        if errorlevel 1 exit /b 1

                        docker push %ECR_REGISTRY%/order-service:1.0
                        if errorlevel 1 exit /b 1
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                echo 'Deploying application to EC2 using AWS SSM'

                withCredentials([
                    usernamePassword(
                        credentialsId: 'aws-jenkins-credentials',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
                ]) {
                    powershell '''
                        $ErrorActionPreference = "Stop"

                        $commands = @(
                            "cd /home/ssm-user/aws-devops-microservices",
                            "git pull --ff-only origin main",
                            "aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin 569103038072.dkr.ecr.us-east-1.amazonaws.com",
                            "sudo docker compose -f docker-compose.ec2.yml pull",
                            "sudo docker compose -f docker-compose.ec2.yml up -d"
                        )

                        $parameters = @{
                            commands = $commands
                        }

                        $json = ConvertTo-Json -InputObject $parameters -Depth 5 -Compress

                        $jsonFile = Join-Path $env:TEMP "ssm-deploy.json"

                        [System.IO.File]::WriteAllText(
                            $jsonFile,
                            $json,
                            [System.Text.UTF8Encoding]::new($false)
                        )

                        Write-Host "Sending deployment command to EC2..."

                        $commandId = & aws ssm send-command `
                            --instance-ids $env:EC2_INSTANCE_ID `
                            --document-name "AWS-RunShellScript" `
                            --parameters "file://$jsonFile" `
                            --region $env:AWS_DEFAULT_REGION `
                            --query "Command.CommandId" `
                            --output text

                        if ($LASTEXITCODE -ne 0) {
                            throw "Failed to send SSM command"
                        }

                        Write-Host "SSM Command ID: $commandId"

                        $status = "Pending"

                        for ($i = 1; $i -le 30; $i++) {

                            Start-Sleep -Seconds 10

                            $status = & aws ssm get-command-invocation `
                                --command-id $commandId `
                                --instance-id $env:EC2_INSTANCE_ID `
                                --region $env:AWS_DEFAULT_REGION `
                                --query "Status" `
                                --output text 2>$null

                            if ($LASTEXITCODE -ne 0) {
                                Write-Host "Waiting for EC2 command..."
                                continue
                            }

                            Write-Host "Deployment status: $status"

                            if ($status -eq "Success") {
                                break
                            }

                            if ($status -in @("Failed", "TimedOut", "Cancelled")) {
                                break
                            }
                        }

                        if ($status -ne "Success") {
                            throw "EC2 deployment failed or timed out. Final status: $status"
                        }

                        Write-Host "Deployment completed successfully!"

                        aws ssm get-command-invocation `
                            --command-id $commandId `
                            --instance-id $env:EC2_INSTANCE_ID `
                            --region $env:AWS_DEFAULT_REGION `
                            --query "StandardOutputContent" `
                            --output text

                        if ($LASTEXITCODE -ne 0) {
                            throw "Could not retrieve deployment output"
                        }
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: CI/CD pipeline completed!'
            echo 'All three microservices have been deployed to EC2.'
        }

        failure {
            echo 'FAILED: Please check the Jenkins Console Output.'
        }

        always {
            echo 'Pipeline execution finished.'
        }
    }
}