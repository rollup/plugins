import nodeResolve, { DEFAULT_OPTIONS } from './index';

const wrapper = nodeResolve;
wrapper.DEFAULT_OPTIONS = DEFAULT_OPTIONS;

export default wrapper;
