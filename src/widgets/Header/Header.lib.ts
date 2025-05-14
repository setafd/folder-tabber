import { NUMBER_HOTKEYS } from './Header.const';

export const getIndexByKeyboardNumber = (number: (typeof NUMBER_HOTKEYS)[number]) => {
  if (number === '0') {
    return 9;
  }
  return Number(number) - 1;
};
