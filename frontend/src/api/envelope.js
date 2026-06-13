export function data(response) {
  return response.data.data;
}

export function list(response) {
  return response.data.data;
}

export function ok(response) {
  return { data: data(response) };
}

export function okList(response) {
  return { data: list(response), meta: response.data.meta };
}
