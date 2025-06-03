# AWS S3 Configuration

## Bucket Policy

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowAppAccess",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::ilbuco-clean",
                "arn:aws:s3:::ilbuco-clean/*"
            ]
        },
        {
            "Sid": "PublicRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::ilbuco-clean/*",
            "Condition": {
                "StringLike": {
                    "aws:Referer": [
                        "https://il-buco-cleaners.vercel.app/*",
                        "http://localhost:*/*"
                    ]
                }
            }
        }
    ]
}
```

## CORS Configuration

```json
{
    "CORSRules": [
        {
            "AllowedOrigins": [
                "https://il-buco-cleaners.vercel.app",
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:3002",
                "http://localhost:3003",
                "http://localhost:3004"
            ],
            "AllowedMethods": [
                "GET",
                "PUT",
                "POST",
                "HEAD"
            ],
            "AllowedHeaders": [
                "*"
            ],
            "ExposeHeaders": [
                "ETag"
            ],
            "MaxAgeSeconds": 3000
        }
    ]
}
```

## How to Apply in AWS Console

1. For Bucket Policy:
   - Go to S3 in AWS Console
   - Click on your bucket 'ilbuco-clean'
   - Go to 'Permissions' tab
   - Find 'Bucket policy' section
   - Click 'Edit'
   - Paste the bucket policy JSON
   - Click 'Save changes'

2. For CORS:
   - Stay in the same 'Permissions' tab
   - Find 'Cross-origin resource sharing (CORS)'
   - Click 'Edit'
   - Paste the CORS configuration JSON
   - Click 'Save changes'

Make sure to also check that:
- Block all public access is turned OFF for the bucket
- ACLs are enabled if you need them

