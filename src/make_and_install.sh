#!/bin/bash

# Be sure to copy the instal.sh.template script to install.sh and edit
# this with the correct paths. Or you can just use make.sh and drag the 
# created XPI file into the Firefox window.

set -x
set -e
set -u  # give error for unbound variables

source make.sh

# The make script will create a variable called xpi_file
#source install.sh ${xpi_file} ${extension_uuid}
source install.sh ${xpi_file} ${extension_uuid}

