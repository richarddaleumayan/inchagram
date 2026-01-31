# EC2 Instance Scheduler - Deployment Guide

> **Instance:** i-070b7480ae1b6443c (inchagram-backend, t3.small)
> **Schedule:** 9 AM - 6 PM Mon-Fri (Philippine Time)
> **Expected Savings:** ~$132/year (72% reduction)

---

## Step 1: Create IAM Policy (2 minutes)

1. Go to **IAM Console** → **Policies** → **Create Policy**
2. Click **JSON** tab
3. Copy and paste the content from `iam-policy.json`
4. Click **Next: Tags** (skip tags)
5. Click **Next: Review**
6. **Name:** `InchagramEC2SchedulerPolicy`
7. **Description:** `Allows Lambda to start/stop Inchagram EC2 instance`
8. Click **Create policy**

---

## Step 2: Create IAM Role for Lambda (2 minutes)

1. Go to **IAM Console** → **Roles** → **Create Role**
2. **Trusted entity type:** AWS service
3. **Use case:** Lambda → Click **Next**
4. **Attach policies:**
   - Search and select: `InchagramEC2SchedulerPolicy` (the one you just created)
   - Search and select: `AWSLambdaBasicExecutionRole` (AWS managed)
5. Click **Next**
6. **Role name:** `InchagramEC2SchedulerRole`
7. **Description:** `Execution role for EC2 instance scheduler Lambda functions`
8. Click **Create role**

---

## Step 3: Create STOP Lambda Function (3 minutes)

1. Go to **Lambda Console** → **Create Function**
2. **Function name:** `StopInchagramInstance`
3. **Runtime:** Python 3.12
4. **Architecture:** x86_64
5. **Permissions:**
   - Expand "Change default execution role"
   - Select "Use an existing role"
   - Choose: `InchagramEC2SchedulerRole`
6. Click **Create function**

7. In the **Code** tab:
   - Delete the default code
   - Copy and paste the entire content from `lambda-stop-instance.py`
   - Click **Deploy**

8. **IMPORTANT: Increase timeout** (prevents timeout errors):
   - Click **Configuration** tab
   - Click **General configuration** on the left
   - Click **Edit**
   - Change **Timeout** to: `30` seconds (0 min 30 sec)
   - Click **Save**

9. **Test it** (optional but recommended):
   - Click **Test** tab
   - Event name: `TestStop`
   - Click **Save**
   - Click **Test** again
   - Should see: "Successfully stopped instance" or "Instance already stopped"
   - **IMPORTANT:** Start your instance again if you need it running now!

---

## Step 4: Create START Lambda Function (3 minutes)

1. Go to **Lambda Console** → **Create Function**
2. **Function name:** `StartInchagramInstance`
3. **Runtime:** Python 3.12
4. **Architecture:** x86_64
5. **Permissions:**
   - Expand "Change default execution role"
   - Select "Use an existing role"
   - Choose: `InchagramEC2SchedulerRole`
6. Click **Create function**

7. In the **Code** tab:
   - Delete the default code
   - Copy and paste the entire content from `lambda-start-instance.py`
   - Click **Deploy**

8. **IMPORTANT: Increase timeout** (prevents timeout errors):
   - Click **Configuration** tab
   - Click **General configuration** on the left
   - Click **Edit**
   - Change **Timeout** to: `30` seconds (0 min 30 sec)
   - Click **Save**

9. **Test it** (optional):
   - Click **Test** tab
   - Event name: `TestStart`
   - Click **Save**
   - Click **Test** again
   - Should see: "Successfully started instance" or "Instance already running"

---

## Step 5: Create EventBridge Schedule - STOP (3 minutes)

1. Go to **EventBridge Console** → **Scheduler** → **Create schedule**
2. **Schedule name:** `StopInchagramNightly`
3. **Description:** `Stop Inchagram EC2 at 6 PM PHT (10 AM UTC) Mon-Fri`
4. **Schedule pattern:**
   - Select: **Recurring schedule**
   - **Cron-based schedule**
   - Cron expression: `0 10 ? * MON-FRI *`
   - (This is 6 PM Philippine Time = UTC+8, so 6 PM - 8 = 10 AM UTC)
5. **Flexible time window:** Off
6. Click **Next**

7. **Target:**
   - **Target API:** All APIs → AWS Lambda → Invoke
   - **Lambda function:** `StopInchagramInstance`
8. Click **Next**

9. **Settings:**
   - **Retry policy:** Default (180 attempts over 24 hours)
10. Click **Next**

11. Review and click **Create schedule**

---

## Step 6: Create EventBridge Schedule - START (3 minutes)

1. Go to **EventBridge Console** → **Scheduler** → **Create schedule**
2. **Schedule name:** `StartInchagramMorning`
3. **Description:** `Start Inchagram EC2 at 9 AM PHT (1 AM UTC) Mon-Fri`
4. **Schedule pattern:**
   - Select: **Recurring schedule**
   - **Cron-based schedule**
   - Cron expression: `0 1 ? * MON-FRI *`
   - (This is 9 AM Philippine Time = UTC+8, so 9 AM - 8 = 1 AM UTC)
5. **Flexible time window:** Off
6. Click **Next**

7. **Target:**
   - **Target API:** All APIs → AWS Lambda → Invoke
   - **Lambda function:** `StartInchagramInstance`
8. Click **Next**

9. **Settings:**
   - **Retry policy:** Default (180 attempts over 24 hours)
10. Click **Next**

11. Review and click **Create schedule**

---

## Step 7: Verify Setup (2 minutes)

### Check EventBridge Schedules
1. Go to **EventBridge** → **Scheduler** → **Schedules**
2. You should see:
   - ✅ `StartInchagramMorning` - Enabled
   - ✅ `StopInchagramNightly` - Enabled

### Check Lambda Functions
1. Go to **Lambda Console**
2. You should see:
   - ✅ `StartInchagramInstance`
   - ✅ `StopInchagramInstance`

### Test the Schedule
You can manually test by:
1. Go to **EventBridge** → **Scheduler** → **Schedules**
2. Select `StopInchagramNightly`
3. Click **Actions** → **Invoke**
4. Check your EC2 instance - it should stop within 30 seconds
5. Repeat with `StartInchagramMorning` to start it again

---

## Your Schedule (Philippine Time)

| Day | Start Time | Stop Time | Running Hours |
|-----|------------|-----------|---------------|
| Monday | 9:00 AM | 6:00 PM | 9 hours |
| Tuesday | 9:00 AM | 6:00 PM | 9 hours |
| Wednesday | 9:00 AM | 6:00 PM | 9 hours |
| Thursday | 9:00 AM | 6:00 PM | 9 hours |
| Friday | 9:00 AM | 6:00 PM | 9 hours |
| **Saturday** | **OFF** | **OFF** | **0 hours** |
| **Sunday** | **OFF** | **OFF** | **0 hours** |

**Total:** ~45 hours/week = ~200 hours/month (vs 730 hours 24/7)

---

## Cost Breakdown

### Before Scheduler
- **Instance:** t3.small @ $0.0208/hour
- **Running:** 24/7 (730 hours/month)
- **Monthly cost:** $15.18
- **Annual cost:** $182.16

### After Scheduler
- **Running:** 9-6 Mon-Fri (200 hours/month)
- **Monthly cost:** $4.16
- **Annual cost:** $49.92
- **Lambda cost:** ~$0.20/month (basically free)

### Savings
- **Monthly:** $11.02 saved
- **Annual:** $132.24 saved
- **Reduction:** 72.6%

---

## Important Notes

### ⚠️ Things to Know

1. **Your app needs to auto-start on boot**
   - Make sure your Node.js app, MongoDB, etc. start automatically
   - Use systemd or PM2 with `pm2 startup`

2. **Elastic IP charges**
   - If you have an Elastic IP attached, you'll be charged when instance is stopped
   - Cost: $0.005/hour = ~$2.74/month when stopped
   - Still net positive, but reduces savings to ~$105/year

3. **First deployment after start**
   - Instance takes ~2-3 minutes to fully boot
   - Your app may need another 1-2 minutes to start
   - Total downtime: ~5 minutes after scheduled start

4. **Manual override**
   - You can always start/stop manually via AWS Console
   - Schedules will still trigger at their times
   - If stopped manually, it will auto-start at 9 AM next weekday

5. **Timezone is important**
   - Cron expressions use UTC
   - Philippine Time = UTC+8
   - The schedules already account for this

### 📧 Optional: Add Email Notifications

If you want to be notified when instance starts/stops:

1. Go to **SNS Console** → Create topic
2. Name: `InchagramEC2Notifications`
3. Create subscription with your email
4. Edit each Lambda function:
   - Add SNS publish permission
   - Add code to publish to SNS topic
   - (I can provide code if you want this)

---

## Troubleshooting

### Instance doesn't stop/start at scheduled time
1. Check EventBridge → Schedules → Select schedule → View metrics
2. Check Lambda → Select function → Monitor → View logs in CloudWatch
3. Verify timezone conversion is correct (PHT = UTC+8)

### Lambda function fails
1. Check IAM role has both policies attached
2. Check CloudWatch Logs for error messages
3. Verify instance ID is correct in Lambda code

### Want to change schedule?
1. Go to EventBridge → Schedules
2. Select schedule → Edit
3. Update cron expression
4. Save

### Want to disable temporarily?
1. Go to EventBridge → Schedules
2. Select schedule → Actions → Disable
3. Re-enable when ready

---

## Customization Ideas

### Extend hours on specific days
Edit cron to run longer on certain days:
```
# Stop at 10 PM on Fridays (14:00 UTC)
0 14 ? * FRI *

# Stop at 6 PM other days (10:00 UTC)
0 10 ? * MON-THU *
```

### Weekend on-demand
Keep stopped on weekends, but you can manually start when needed.

### Gradual shutdown
Add a 30-minute warning before shutdown:
- Create SNS notification 30 min before stop
- Gives you time to finish work or delay shutdown

---

## Summary

✅ **Total setup time:** ~20 minutes
✅ **Monthly cost reduction:** 72%
✅ **Annual savings:** $132
✅ **Automatic:** Runs without intervention
✅ **Override:** Can manually start/stop anytime

**Next Steps:**
1. Follow steps 1-6 above
2. Test both Lambda functions
3. Verify schedules are enabled
4. Monitor first week to ensure smooth operation
5. Enjoy the savings! 💰

---

## Questions?

Common questions:

**Q: What if I need the server on weekend?**
A: Just start it manually via AWS Console. It will auto-stop Sunday night if running.

**Q: Can I change the schedule later?**
A: Yes! Just edit the EventBridge schedules.

**Q: What if I forget to start it manually?**
A: It will auto-start Monday 9 AM anyway.

**Q: Does this affect data?**
A: No! Stopping EC2 is like shutting down a computer. EBS volume data persists.

**Q: What about database data?**
A: If MongoDB is on the same instance, it's fine. Data persists on the EBS volume.
