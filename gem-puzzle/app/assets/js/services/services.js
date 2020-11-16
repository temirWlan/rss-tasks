export const addZero = num => num < 10 ? `0${num}` : `${num}`;
export const setCorrectNum = (num, max) => +num > max ? '00' : `${num}`;