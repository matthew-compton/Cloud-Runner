#!/bin/bash

# The desired zip file name
name=CloudRunner-ChromeApp.zip

# Check if zip file already exists
if [ -f $name ]; then
	# If so, delete it
	rm CloudRunner-ChromeApp.zip
fi

# zip the files together
zip -r CloudRunner-ChromeApp .
