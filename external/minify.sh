# Minify using the google closure compiler.
# https://developers.google.com/closure/compiler/?hl=en-US

# Assumes the compiler is installed in ~/Install/google-closure-compiler/compiler-latest/
java -jar ~/Install/google-closure-compiler/compiler-latest/compiler.jar --js jquery.flot.js --js_output_file=jquery.flot.min.js
