FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies only
COPY package*.json ./
RUN npm install --production

# Copy app source
COPY . .

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "index.js"]
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "index.js"]
