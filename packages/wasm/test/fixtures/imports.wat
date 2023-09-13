(module
  (func $foobar (import "env" "foobar") (param i32))
  (func (export "main")
    (call $foobar (i32.const 10))
  )
)
