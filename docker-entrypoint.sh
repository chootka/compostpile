#!/bin/sh

npm install

while :; do
	echo 'starting nodejs app'
  node server.js
	sleep 5
done

