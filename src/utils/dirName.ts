import { dirname } from 'path';
import { fileURLToPath } from 'url';

const dirName = () => {
  return dirname(fileURLToPath(import.meta.url));
};

export default dirName;
