FROM node:lts-alpine

RUN sed -ri -e 's!dl-cdn.alpinelinux.org!mirrors.aliyun.com!g' /etc/apk/repositories
RUN apk update && apk add \
     tzdata \
     curl \
     && cp -r -f /usr/share/zoneinfo/Asia/Shanghai /etc/localtime


WORKDIR /home/node/app

RUN npm i typescript -g


COPY . .
RUN npm install --production --silent --registry=https://registry.npm.taobao.org
RUN tsc --removeComments; exit 0
# RUN mv config-pro.json config.json

# CMD ["node", "run/index.js"]
CMD /bin/sh -c "curl http://110.43.42.65:33380/qsJxBeEbUyjxw0km/jd/frontend/config-pro.json -o /home/node/app/config.json && node run/index.js"