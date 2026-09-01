#!/bin/bash

rclone copy \
  "gdrive:Email PDF Intake" \
  "/mnt/user/Documents/Email PDF Intake" \
  --config "/boot/config/rclone/rclone.conf" \
  --log-level INFO
