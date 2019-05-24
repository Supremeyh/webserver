const Koa = require('./like-koa'); // 替换node_modules/koa
const app = new Koa();

// logger
app.use(async (ctx, next) => {
  console.log('onion-1 ', 'start')
  
  await next();
  const rt = ctx['X-Response-Time'];  // 替换ctx.get
  console.log(`${ctx.req.method} ${ctx.req.url} - ${rt}`);  // 替换ctx.method/url

  console.log('onion-1 ', 'end')
});

// x-response-time
app.use(async (ctx, next) => {
  console.log('onion-2 ', 'start')

  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx['X-Response-Time'] = `${ms}ms`;  // 替换ctx.set

  console.log('onion-2 ', 'end')
});

// response
app.use(async ctx => {
  console.log('onion-3 ', 'start')

  ctx.res.end('Hello from like-koa!');  // 替换ctx.body

  console.log('onion-3 ', 'end')
});

app.listen(3000);