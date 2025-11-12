up:
	docker compose up -d --build

down:
	docker compose down -v

logs:
	docker compose logs -f --tail=200

seed:
	SEED=1 docker compose up -d --build backend

