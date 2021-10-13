FROM node:16-slim

LABEL "maintainer"="Ali Rostami"

RUN apt-get update \
    # See https://crbug.com/795759
    && apt-get install -yq libgconf-2-4 \
    # Install ffmpeg
    && apt-get install -y ffmpeg \
    # Install latest chrome dev package, which installs the necessary libs to
    # make the bundled version of Chromium that Puppeteer installs work.
    && apt-get install -y gnupg gnupg2 gnupg1 \
    && apt-get install -y wget xvfb --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    # Create app directory
    && mkdir -m 777 -p /app

WORKDIR /app

COPY .yarn /app/.yarn
COPY package.json yarn.lock .yarnrc .yarnrc.yml /app/

RUN yarn

COPY . /app

# RUN adduser --disabled-password --gecos '' r \
#   && adduser r sudo \
#   && echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Create non-root group and user
ENV SERVICE_NAME="daan"

CMD ["./entrypoint.sh"]
