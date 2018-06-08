## Installation en local

Installation : 
```
cd docker
docker-compose pull
docker pull mlacaud/server_eval
```

Lancement : 
```
export VIDEOFOLDER=path/to/folder/
docker-compose up -d

#attendre un peu
bash launchNetworks 9 3
```
