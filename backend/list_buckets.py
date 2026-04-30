import boto3

import os
client = boto3.client(
    's3',
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
    region_name=os.environ.get('AWS_REGION', 'us-east-1')
)
try:
    buckets = client.list_buckets().get('Buckets', [])
    if buckets:
        print('Your S3 Buckets:')
        for b in buckets:
            print(f'  -> {b["Name"]}')
            # Also show objects in each bucket
            try:
                objs = client.list_objects_v2(Bucket=b["Name"], MaxKeys=5)
                for o in objs.get('Contents', []):
                    print(f'       file: {o["Key"]}')
            except Exception as e2:
                print(f'       (cannot list objects: {e2})')
    else:
        print('No S3 buckets found in this account.')
except Exception as e:
    print(f'Error: {e}')
