const Koa = require('koa');
const app = new Koa();

// logger
app.use(async (ctx, next) => {
  console.log('onion-1 ', 'start')
  
  await next();
  const rt = ctx.response.get('X-Response-Time');
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);

  console.log('onion-1 ', 'end')
});

// x-response-time
app.use(async (ctx, next) => {
  console.log('onion-2 ', 'start')

  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);

  console.log('onion-2 ', 'end')
});

// response
app.use(async ctx => {
  console.log('onion-3 ', 'start')

  ctx.body = 'Hello World';

  console.log('onion-3 ', 'end')
});

app.listen(3000);