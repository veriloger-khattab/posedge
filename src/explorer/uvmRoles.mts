// Recognises UVM component roles from file names (apb_driver.sv -> driver). Pure, so it is unit-tested.

import { BADGE_EXTENSIONS, UVM_ROLES, type UvmRole } from '../../design/uvm.mts';

export function roleForFileName(fileName: string): UvmRole | undefined {
  const lower = fileName.toLowerCase();
  const ext = BADGE_EXTENSIONS.find((e) => lower.endsWith(e));
  if (!ext) return undefined;
  const stem = lower.slice(0, -ext.length);
  return UVM_ROLES.find((r) => r.names?.includes(stem) || r.suffixes.some((s) => stem.endsWith(s) && stem.length > s.length));
}
