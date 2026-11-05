pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        AWS_ACCOUNT_ID = '569103038072'
        EC2_INSTANCE_ID = 'i-02821d1a15040897d'

        ECR_REGISTRY = '569103038072.dkr.ecr.us-east-1.amazonaws.com'

        USER_IMAGE = '569103038072.dkr.ecr.us-east-1.amazonaws.com/user-service'
        PRODUCT_IMAGE = '569103038072.dkr.ecr.us-east-1.amazonaws.com/product-service'
        ORDER_IMAGE = '569103038072.dkr.ecr.us-east-1.amazonaws.com/order-service'
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
                bat 'dir'
            }
        }

        stage('Build') {
            steps {
                echo 'Building microservices...'

                dir('user-service') {
                    bat 'npm install'
                }

                dir('product-service') {
                    bat 'npm install'
                }

                dir('order-service') {
                    bat 'npm install'
                }
            }
        }

        stage('Test') {
            steps {
                echo 'Testing User Service...'
                dir('user-service') {
                    bat 'npm test'
                }

                echo 'Testing Product Service...'
                dir('product-service') {
                    bat 'npm test'
                }

                echo 'Testing Order Service...'
                dir('order-service') {
                    bat 'npm test'
                }
            }
        }

        stage('Docker Build') {
            steps {
                bat 'docker build -t %USER_IMAGE%:1.0 user-service'
                bat 'docker build -t %PRODUCT_IMAGE%:1.0 product-service'
                bat 'docker build -t %ORDER_IMAGE%:1.0 order-service'
            }
        }

        stage('Push Images to ECR') {
            steps {
                bat '''
                aws ecr get-login-password --region %AWS_REGION% | docker login --username AWS --password-stdin %ECR_REGISTRY%
                '''

                bat 'docker push %USER_IMAGE%:1.0'
                bat 'docker push %PRODUCT_IMAGE%:1.0'
                bat 'docker push %ORDER_IMAGE%:1.0'
            }
        }

        stage('Deploy to EC2') {
            steps {
                powershell '''
                    $remoteCommand = "cd /home/ssm-user/aws-devops-microservices && aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin 569103038072.dkr.ecr.us-east-1.amazonaws.com && sudo docker compose -f docker-compose.ec2.yml pull && sudo docker compose -f docker-compose.ec2.yml up -d"

                    $parameters = @{
                        commands = @($remoteCommand)
                    } | ConvertTo-Json -Compress

                    $inputFile = "$env:TEMP\\ssm-deploy.json"
                    Set-Content -Path $inputFile -Value $parameters -Encoding ASCII

                    $result = aws ssm send-command `
                        --region us-east-1 `
                        --instance-ids i-02821d1a15040897d `
                        --document-name AWS-RunShellScript `
                        --parameters "file://$inputFile" `
                        --output json | ConvertFrom-Json

                    $commandId = $result.Command.CommandId

                    if (-not $commandId) {
                        throw "Failed to start EC2 deployment command."
                    }

                    Write-Host "SSM Command ID: $commandId"

                    for ($i = 0; $i -lt 30; $i++) {
                        Start-Sleep -Seconds 10

                        $status = aws ssm get-command-invocation `
                            --region us-east-1 `
                            --command-id $commandId `
                            --instance-id i-02821d1a15040897d `
                            --query Status `
                            --output text

                        Write-Host "Deployment status: $status"

                        if ($status -eq "Success") {
                            break
                        }

                        if ($status -in @("Failed", "Cancelled", "TimedOut")) {
                            throw "EC2 deployment failed: $status"
                        }
                    }

                    if ($status -ne "Success") {
                        throw "EC2 deployment timed out."
                    }
                '''
            }
        }
    }

    post {
        success {
            echo 'CI/CD Pipeline completed successfully!'
        }

        failure {
            echo 'CI/CD Pipeline failed. Check Console Output.'
        }
    }
}