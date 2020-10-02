export class Repo {
  id: string;
  type: string;
  attributes: RepoAttributes;
}

export class RepoAttributes {
  name = '';
  url = '';
}
