import { Buffer } from 'buffer';

export default BufferList;

function BufferList() {
  this.head = null;
  this.tail = null;
  this.length = 0;
}

BufferList.prototype.push = function(v) {
  const entry = { data: v, next: null };
  if (this.length > 0) this.tail.next = entry;
  else this.head = entry;
  this.tail = entry;
  ++this.length;
};

BufferList.prototype.unshift = function(v) {
  const entry = { data: v, next: this.head };
  if (this.length === 0) this.tail = entry;
  this.head = entry;
  ++this.length;
};

BufferList.prototype.shift = function() {
  if (this.length === 0) return;
  const ret = this.head.data;
  if (this.length === 1) this.head = this.tail = null;
  else this.head = this.head.next;
  --this.length;
  return ret;
};

BufferList.prototype.clear = function() {
  this.head = this.tail = null;
  this.length = 0;
};

BufferList.prototype.join = function(s) {
  if (this.length === 0) return '';
  let p = this.head;
  let ret = `${p.data}`;
  while ((p = p.next)) {
    ret += s + p.data;
  }
  return ret;
};

BufferList.prototype.concat = function(n) {
  if (this.length === 0) return Buffer.alloc(0);
  if (this.length === 1) return this.head.data;
  const ret = Buffer.allocUnsafe(n >>> 0);
  let p = this.head;
  let i = 0;
  while (p) {
    p.data.copy(ret, i);
    i += p.data.length;
    p = p.next;
  }
  return ret;
};
