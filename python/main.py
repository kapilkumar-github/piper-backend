from fastapi import FastAPI
app = FastAPI()

@app.post("/parse")
def parse(data: dict):
    result = parse_resume(data["text"])
    return {"result": extract_json(result)}