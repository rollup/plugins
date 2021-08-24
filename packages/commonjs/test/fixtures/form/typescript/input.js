const React = require("React");

interface ButtonProps {
  children: React.Children;
  className: String;
}

module.exports = function Button(props: ButtonProps) {
  return <button {...props} />;
}
