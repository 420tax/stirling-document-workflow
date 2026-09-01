#!/bin/bash

rclone copy \
  "gdrive:OSS Document Scanner" \
  "/mnt/user/Documents/OSS Document Scanner" \
  --config "/boot/config/rclone/rclone.conf" \
  --log-level INFO
