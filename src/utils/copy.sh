#!/bin/sh
cd /Users/sea/Desktop/OnGoing/HelloWorld/FullStack/Node/webserver/src/logs
cp access.log $(date +%Y-%m-%d).access.log
echo "" > access.log
