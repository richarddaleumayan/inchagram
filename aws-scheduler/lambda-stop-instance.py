"""
Lambda Function: Stop Inchagram EC2 Instance
Schedule: 6 PM Mon-Fri (Philippine Time = 10 AM UTC)
"""
import boto3
import json

def lambda_handler(event, context):
    ec2 = boto3.client('ec2')

    # Your instance ID
    instance_id = 'i-070b7480ae1b6443c'

    try:
        # Check current state
        response = ec2.describe_instances(InstanceIds=[instance_id])
        current_state = response['Reservations'][0]['Instances'][0]['State']['Name']

        print(f'Instance {instance_id} current state: {current_state}')

        if current_state == 'running':
            # Stop the instance
            ec2.stop_instances(InstanceIds=[instance_id])
            print(f'✅ Successfully stopped instance: {instance_id}')

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': f'Successfully stopped instance {instance_id}',
                    'previous_state': current_state
                })
            }
        else:
            print(f'⏭️  Instance already in {current_state} state, skipping')

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': f'Instance already {current_state}, no action taken',
                    'current_state': current_state
                })
            }

    except Exception as e:
        print(f'❌ Error: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
