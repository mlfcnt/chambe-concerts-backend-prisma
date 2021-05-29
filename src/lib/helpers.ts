export const capitalizeFirstLetter = (string, type) => {
  if (type === 'sentence') {
    const stringtoUppercase = string.split(' ')[0];
    return stringtoUppercase.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }
  const newString = string.toLowerCase();
  return newString.charAt(0).toUpperCase() + newString.slice(1);
};

export const capitalizeFirstLetters = (sentence) => {
  return sentence
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
    .join(' ');
};
