#!/bin/bash

set -x
set -e

# The name of the extension.
extension_name="plottit"

# The UUID of the extension.
extension_uuid="plottit@titusjan.nl"

# The name of the profile dir where the extension can be installed.
profile_dir="py4p8246.Development"

# absolute base path extension_dir
pushd ..
base_dir="$PWD"
popd

# The target location of the build and build files.
bin_dir="${base_dir}/bin"

# The target XPI file.
xpi_file="$bin_dir/$extension_name.xpi"

# The location of the extension profile.
# Uncomment for os-darwin
profile_location="${HOME}/Library/Application Support/Firefox/Profiles/$profile_dir/extensions"
# Uncomment for linux-gnu
# profile_location=~/.mozilla/firefox/$(profile_dir)/extensions/$(extension_uuid)
# Uncomment in other cases
#profile_location="$(subst \,\\,$(APPDATA))\\Mozilla\\Firefox\\Profiles\\$(profile_dir)\\extensions\\$(extension_uuid)"

installed_xpi_file="${profile_location}/${extension_uuid}.xpi"

# The temporary location where the extension tree will be copied and built.
build_dir="$bin_dir/build"


# Start from scratch

rm -rf "${build_dir}"
rm -f "${xpi_file}"
rm -rf "${installed_xpi_file}"

# Start copying (use rsynch to exclude hidden (.svn) files)
mkdir "${build_dir}"
#cp -r * "${build_dir}"
rsync -rv --exclude='.*' * "${build_dir}"


# Make xpi archive
pushd "${build_dir}"
zip -r "${xpi_file}" *
popd

# Instal xpi

echo "${profile_location}"
cp -f "${xpi_file}" "${installed_xpi_file}"



