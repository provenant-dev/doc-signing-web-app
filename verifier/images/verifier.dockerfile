FROM weboftrust/keri:1.2.0-dev13

WORKDIR /usr/local/var

RUN mkdir verifier
COPY . /usr/local/var/verifier

WORKDIR /usr/local/var/verifier/

RUN pip install -r requirements.txt

ENTRYPOINT ["verifier", "server", "start", "--config-dir", "scripts", "--config-file", "verifier-config-public.json"]