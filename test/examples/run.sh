#!/bin/bash

cd "$(dirname "$0")"

cd ../../examples

echo "Installing example dependencies..."
npm install --no-save

if [ -f ../enigma.tgz ]; then
  echo "Found local enigma.tgz file, installing..."
  npm install ../enigma.tgz --no-save
fi

examples=(
	basics/events/generated-apis.js
	basics/events/session.js
	basics/lists/app-object-list.js
	basics/lists/field-list.js
	data/hypercubes/hypercube-pivot.js
	data/hypercubes/hypercube-stacked.js
	data/hypercubes/hypercube-straight.js
	data/list-object/list-object.js
	data/string-expression/string-expression.js
	interceptors/retry-aborted/retry-aborted.js
	mixins/complex/complex.js
	mixins/simple/simple.js
)

for example in ${examples[@]}; do
	echo
	echo "Starting example: $example"
        echo "process.on('unhandledRejection',error=>console.log(error)||process.exit(1));require('./$example');" > run.js
        node run
	echo "Ending example: $example"
done
