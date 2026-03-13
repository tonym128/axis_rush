import TexGen from 'texgenjs';
import WordParser from 'texgenjs/words';

const texgen = new TexGen();
const parser = new WordParser();
try {
  const info = parser.parse("green grid hard");
  const dataUrl = texgen.bake(info.shader, { width: 256, height: 256 });
  console.log("Success, data URL starts with:", dataUrl.substring(0, 30));
} catch (e) {
  console.error(e);
}
