JS = $$(find index.js ./lib ./test -name '*.js')

test: validate
	@./node_modules/.bin/mocha test --reporter dot

clean:
	@rm -fr node_modules
	@rm -fr ./lib-cov

validate:
	@jshint --config .jshintrc $(JS)

coverage:
	@rm -fr ./lib-cov
	@jscoverage ./lib ./lib-cov
	@-TEST_COVERAGE_AK_MODEL=1 ./node_modules/.bin/mocha --reporter html-cov > ./lib-cov/index.html

.PHONY: clean test validate coverage
