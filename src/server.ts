import app from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`Generative AI Playground running on port ${config.port}`);
});
