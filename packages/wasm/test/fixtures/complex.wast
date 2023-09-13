(module
  (type $t0 (func (param i32)))
  (type $t1 (func (param i32 i32) (result i32)))
  (type $t2 (func (param i32 i32)))
  (type $t3 (func (param i32 i32 i32)))
  (type $t4 (func (param i32) (result i32)))
  (type $t5 (func (result i32)))
  (import "env" "memory" (memory $env.memory 0))
  (import "env" "log" (func $env.log (type $t0)))
  (func $f1 (type $t1) (param $p0 i32) (param $p1 i32) (result i32)
    (local $l0 i32)
    (set_local $l0
      (i32.add
        (get_local $p0)
        (get_local $p1)))
    (i32.store
      (i32.add
        (get_local $l0)
        (i32.const 8))
      (i32.add
        (get_local $l0)
        (i32.const 20)))
    (i32.store
      (i32.add
        (get_local $l0)
        (i32.const 0))
      (i32.const 0))
    (i32.store
      (i32.add
        (get_local $l0)
        (i32.const 4))
      (get_local $p0))
    (i32.store
      (i32.add
        (get_local $l0)
        (i32.const 16))
      (get_local $p1))
    (i32.store
      (i32.add
        (get_local $l0)
        (i32.const 12))
      (i32.const 0))
    (return
      (get_local $l0)))
  (func $f2 (type $t2) (param $p0 i32) (param $p1 i32)
    (i32.store
      (i32.add
        (get_local $p0)
        (i32.const 12))
      (i32.add
        (i32.load
          (i32.add
            (get_local $p0)
            (i32.const 12)))
        (get_local $p1))))
  (func $f3 (type $t2) (param $p0 i32) (param $p1 i32)
    (i32.store8
      (i32.add
        (i32.load
          (i32.add
            (get_local $p0)
            (i32.const 8)))
        (i32.load
          (i32.add
            (get_local $p0)
            (i32.const 12))))
      (get_local $p1))
    (i32.store
      (i32.add
        (get_local $p0)
        (i32.const 12))
      (i32.add
        (i32.load
          (i32.add
            (get_local $p0)
            (i32.const 12)))
        (i32.const 1))))
  (func $f4 (type $t3) (param $p0 i32) (param $p1 i32) (param $p2 i32)
    (local $l0 i32)
    (set_local $l0
      (i32.const 0))
    (set_local $l0
      (i32.const 0))
    (block $B0
      (loop $L1
        (br_if $B0
          (i32.eqz
            (i32.lt_s
              (get_local $l0)
              (get_local $p2))))
        (call $f3
          (get_local $p0)
          (i32.load
            (i32.add
              (get_local $p1)
              (i32.shl
                (get_local $l0)
                (i32.const 2)))))
        (set_local $l0
          (i32.add
            (get_local $l0)
            (i32.const 1)))
        (br $L1))))
  (func $f5 (type $t3) (param $p0 i32) (param $p1 i32) (param $p2 i32)
    (call $f3
      (get_local $p0)
      (i32.const 60))
    (call $f4
      (get_local $p0)
      (get_local $p1)
      (get_local $p2))
    (call $f3
      (get_local $p0)
      (i32.const 62)))
  (func $f6 (type $t3) (param $p0 i32) (param $p1 i32) (param $p2 i32)
    (call $f3
      (get_local $p0)
      (i32.const 60))
    (call $f3
      (get_local $p0)
      (i32.const 47))
    (call $f4
      (get_local $p0)
      (get_local $p1)
      (get_local $p2))
    (call $f3
      (get_local $p0)
      (i32.const 62)))
  (func $f7 (type $t4) (param $p0 i32) (result i32)
    (if $I0
      (i32.ge_s
        (i32.load
          (i32.add
            (get_local $p0)
            (i32.const 0)))
        (i32.load
          (i32.add
            (get_local $p0)
            (i32.const 16))))
      (then
        (return
          (i32.const 0))))
    (return
      (i32.load8_u
        (i32.add
          (i32.load
            (i32.add
              (get_local $p0)
              (i32.const 4)))
          (i32.load
            (i32.add
              (get_local $p0)
              (i32.const 0)))))))
  (func $f8 (type $t4) (param $p0 i32) (result i32)
    (if $I0
      (i32.ge_s
        (i32.add
          (i32.load
            (i32.add
              (get_local $p0)
              (i32.const 4)))
          (i32.load
            (i32.add
              (get_local $p0)
              (i32.const 0))))
        (i32.load
          (i32.add
            (get_local $p0)
            (i32.const 16))))
      (then
        (return
          (i32.const 0))))
    (return
      (i32.load8_u
        (i32.add
          (i32.add
            (i32.load
              (i32.add
                (get_local $p0)
                (i32.const 4)))
            (i32.load
              (i32.add
                (get_local $p0)
                (i32.const 0))))
          (i32.const 1)))))
  (func $f9 (type $t0) (param $p0 i32)
    (i32.store
      (i32.add
        (get_local $p0)
        (i32.const 0))
      (i32.add
        (i32.load
          (i32.add
            (get_local $p0)
            (i32.const 0)))
        (i32.const 1))))
  (func $f10 (type $t1) (param $p0 i32) (param $p1 i32) (result i32)
    (if $I0
      (i32.eq
        (get_local $p1)
        (i32.const 0))
      (then
        (if $I1
          (i32.eq
            (call $f7
              (get_local $p0))
            (i32.const 0))
          (then
            (return
              (i32.const 0))))
        (i32.store
          (i32.add
            (get_local $p0)
            (i32.const 0))
          (i32.add
            (i32.load
              (i32.add
                (get_local $p0)
                (i32.const 0)))
            (i32.const 1)))
        (return
          (i32.const 1))))
    (if $I2
      (i32.eq
        (get_local $p1)
        (call $f7
          (get_local $p0)))
      (then
        (i32.store
          (i32.add
            (get_local $p0)
            (i32.const 0))
          (i32.add
            (i32.load
              (i32.add
                (get_local $p0)
                (i32.const 0)))
            (i32.const 1)))
        (return
          (i32.const 1))))
    (return
      (i32.const 0)))
  (func $f11 (type $t0) (param $p0 i32)
    (local $l0 i32)
    (set_local $l0
      (call $f10
        (get_local $p0)
        (i32.const 95)))
    (call $f5
      (get_local $p0)
      (get_global $g5)
      (i32.div_s
        (i32.const 8)
        (i32.const 4)))
    (block $B0
      (loop $L1
        (br_if $B0
          (i32.eqz
            (i32.eq
              (i32.const 0)
              (call $f10
                (get_local $p0)
                (i32.const 95)))))
        (call $f3
          (get_local $p0)
          (call $f7
            (get_local $p0)))
        (call $f9
          (get_local $p0))
        (br $L1)))
    (call $f6
      (get_local $p0)
      (get_global $g5)
      (i32.div_s
        (i32.const 8)
        (i32.const 4))))
  (func $f12 (type $t0) (param $p0 i32)
    (local $l0 i32)
    (set_local $l0
      (call $f10
        (get_local $p0)
        (i32.const 42)))
    (set_local $l0
      (call $f10
        (get_local $p0)
        (i32.const 42)))
    (call $f5
      (get_local $p0)
      (get_global $g6)
      (i32.div_s
        (i32.const 4)
        (i32.const 4)))
    (block $B0
      (loop $L1
        (br_if $B0
          (i32.eqz
            (i32.eq
              (i32.const 0)
              (call $f10
                (get_local $p0)
                (i32.const 42)))))
        (call $f3
          (get_local $p0)
          (call $f7
            (get_local $p0)))
        (call $f9
          (get_local $p0))
        (br $L1)))
    (call $f6
      (get_local $p0)
      (get_global $g6)
      (i32.div_s
        (i32.const 4)
        (i32.const 4))))
  (func $f13 (type $t0) (param $p0 i32)
    (local $l0 i32)
    (set_local $l0
      (call $f7
        (get_local $p0)))
    (block $B0
      (loop $L1
        (br_if $B0
          (i32.eqz
            (select
              (i32.ne
                (get_local $l0)
                (i32.const 10))
              (i32.const 0)
              (get_local $l0))))
        (if $I2
          (i32.eq
            (get_local $l0)
            (i32.const 95))
          (then
            (call $f11
              (get_local $p0)))
          (else
            (if $I3
              (select
                (i32.eq
                  (call $f8
                    (get_local $p0))
                  (i32.const 42))
                (i32.const 0)
                (i32.eq
                  (get_local $l0)
                  (i32.const 42)))
              (then
                (call $f12
                  (get_local $p0)))
              (else
                (call $f3
                  (get_local $p0)
                  (get_local $l0))
                (call $f9
                  (get_local $p0))))))
        (set_local $l0
          (call $f7
            (get_local $p0)))
        (br $L1))))
  (func $f14 (type $t0) (param $p0 i32)
    (local $l0 i32)
    (set_local $l0
      (call $f10
        (get_local $p0)
        (i32.const 35)))
    (call $f5
      (get_local $p0)
      (get_global $g2)
      (i32.div_s
        (i32.const 8)
        (i32.const 4)))
    (call $f13
      (get_local $p0))
    (call $f6
      (get_local $p0)
      (get_global $g2)
      (i32.div_s
        (i32.const 8)
        (i32.const 4)))
    (call $f3
      (get_local $p0)
      (i32.const 10)))
  (func $f15 (type $t0) (param $p0 i32)
    (call $f5
      (get_local $p0)
      (get_global $g4)
      (i32.div_s
        (i32.const 8)
        (i32.const 4)))
    (call $f13
      (get_local $p0))
    (call $f6
      (get_local $p0)
      (get_global $g4)
      (i32.div_s
        (i32.const 8)
        (i32.const 4))))
  (func $f16 (type $t0) (param $p0 i32)
    (local $l0 i32)
    (set_local $l0
      (call $f10
        (get_local $p0)
        (i32.const 42)))
    (call $f5
      (get_local $p0)
      (get_global $g3)
      (i32.div_s
        (i32.const 8)
        (i32.const 4)))
    (call $f15
      (get_local $p0))
    (block $B0
      (loop $L1
        (br_if $B0
          (i32.eqz
            (select
              (i32.eq
                (call $f7
                  (get_local $p0))
                (i32.const 42))
              (i32.const 0)
              (call $f7
                (get_local $p0)))))
        (call $f15
          (get_local $p0))
        (br $L1)))
    (call $f6
      (get_local $p0)
      (get_global $g3)
      (i32.div_s
        (i32.const 8)
        (i32.const 4))))
  (func $parse (export "parse") (type $t1) (param $p0 i32) (param $p1 i32) (result i32)
    (local $l0 i32) (local $l1 i32)
    (set_local $l0
      (call $f1
        (get_local $p0)
        (get_local $p1)))
    (set_local $l1
      (i32.const 1))
    (block $B0
      (loop $L1
        (br_if $B0
          (i32.eqz
            (get_local $l1)))
        (if $I2
          (i32.eq
            (call $f7
              (get_local $l0))
            (i32.const 35))
          (then
            (call $f14
              (get_local $l0)))
          (else
            (if $I3
              (select
                (i32.eq
                  (call $f8
                    (get_local $l0))
                  (i32.const 32))
                (i32.const 0)
                (i32.eq
                  (call $f7
                    (get_local $l0))
                  (i32.const 42)))
              (then
                (call $f16
                  (get_local $l0)))
              (else
                (call $f13
                  (get_local $l0))
                (call $f3
                  (get_local $l0)
                  (i32.const 10))))))
        (set_local $l1
          (call $f10
            (get_local $l0)
            (i32.const 10)))
        (br $L1)))
    (return
      (get_local $l0)))
  (func $getOffsetStart (export "getOffsetStart") (type $t5) (result i32)
    (return
      (i32.load
        (i32.add
          (i32.const 0)
          (i32.const 0)))))
  (func $getLength (export "getLength") (type $t4) (param $p0 i32) (result i32)
    (return
      (i32.load
        (i32.add
          (get_local $p0)
          (i32.const 12)))))
  (func $getStart (export "getStart") (type $t4) (param $p0 i32) (result i32)
    (return
      (i32.load
        (i32.add
          (get_local $p0)
          (i32.const 8)))))
  (global $g0 (mut i32) (i32.const 0))
  (global $g1 (mut i32) (i32.const 0))
  (global $g2 i32 (i32.const 4))
  (global $g3 i32 (i32.const 12))
  (global $g4 i32 (i32.const 20))
  (global $g5 i32 (i32.const 28))
  (global $g6 i32 (i32.const 36))
  (data (i32.const 0) "(\00\00\00")
  (data (i32.const 4) "h\00\00\001\00\00\00")
  (data (i32.const 12) "u\00\00\00l\00\00\00")
  (data (i32.const 20) "l\00\00\00i\00\00\00")
  (data (i32.const 28) "e\00\00\00m\00\00\00")
  (data (i32.const 36) "b\00\00\00"))

