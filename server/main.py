from fastapi import FastAPI
from routers import robot

app = FastAPI()

app.include_router(robot.router)

