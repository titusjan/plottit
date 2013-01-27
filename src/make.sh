#!/bin/bash

set -x
set -e
set -u  # give error for unbound variables

# The name of the extension.
extension_name="plottit"

# The UUID of the extension.
extension_uuid="plottit@titusjan.nl"

# absolute base path extension_dir
pushd ..
base_dir="$PWD"
popd

# The target location of the build and build files.
bin_dir="${base_dir}/bin"

# The target XPI file.
xpi_file="$bin_dir/$extension_name.xpi"

# The temporary location where the extension tree will be copied and built.
build_dir="$bin_dir/build"


# Start building from scratch

rm -rf "${build_dir}"
rm -f "${xpi_file}"

# Start copying (use rsynch to exclude hidden (.svn) files)
mkdir "${build_dir}"
#cp -r * "${build_dir}"
rsync -rv --exclude='.*' * "${build_dir}"


# Make xpi archive
pushd "${build_dir}"
zip -r "${xpi_file}" *
popd

echo "Created: ${xpi_file}"
