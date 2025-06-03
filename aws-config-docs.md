# Storage Configuration

This document previously contained AWS S3 configuration that has been removed for security reasons.
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

