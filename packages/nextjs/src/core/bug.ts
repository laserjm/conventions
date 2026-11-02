// NX-LAYER-08, NX-ERR-01: a refusal is a value (`err(...)`); an impossible state is a bug and stops here.

/** Thrown by `bug(...)`: a state the code says cannot happen. Never a refusal, never caught to decide anything. */
export class Bug extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Bug';
  }
}

/**
 * Stops on an impossible state. The one sanctioned throw in `domain/` and `application/`
 * (NX-LAYER-08): a refusal the caller can act on returns `err(...)` instead. The action client
 * reports a bug as `Unexpected`, and an open transaction rolls back.
 *
 *   if (created.error._tag === 'TemplateNotFound') bug('a duplicate names no template');
 */
export function bug(message: string): never {
  throw new Bug(message);
}
