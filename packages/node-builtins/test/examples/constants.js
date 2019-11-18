import {SIGHUP, defaultCoreCipherList} from 'constants';

if (SIGHUP !== _constants.SIGHUP || defaultCoreCipherList !== _constants.defaultCoreCipherList) {
  done(new Error('wrong constants'));
} else {
  done();
}
