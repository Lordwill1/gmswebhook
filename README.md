# Webhook Server

A robust webhook server for handling Bandwidth messaging events with real-time processing, database storage, and comprehensive monitoring capabilities. Perfect for integrating Bandwidth's SMS/MMS services with your applications.
<img width="804" height="629" alt="image" src="https://github.com/user-attachments/assets/e5ef0b0e-4808-4107-a94f-ac4332f0599b" />

## What This Does

This server acts as a "mailbox" for our Bandwidth phone number **+1 (213) 537-----**. When someone sends an SMS to this number, or when we send messages out, Bandwidth forwards all the activity here.

## What Gets Tracked

- **Incoming SMS** - When someone texts our number
- **Outgoing SMS** - When we send messages out
- **Delivery Status** - Whether messages were delivered, failed, etc.
- **Message Content** - The actual text being sent/received
<img width="924" height="614" alt="image" src="https://github.com/user-attachments/assets/e923aedf-b3d7-43e0-af28-8f8a116b69cc" />

## How To Use

1. Go to the website above
2. Click **"View Messages"** to see all SMS activity
3. Click **"View Events"** to see raw data from Bandwidth
4. Use **"Test Webhook"** to try it out without sending real texts

*Built for tracking SMS messages from any sms service provider such as twilo or bandwdith phone line*
