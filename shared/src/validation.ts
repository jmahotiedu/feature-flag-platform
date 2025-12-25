import type {
  Environment,
  FeatureFlag,
  RulePredicate,
  Segment,
  ValidationError,
  ValidationResult
} from "./types.js";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validatePredicates(predicates: unknown, path: string, errors: ValidationError[]): RulePredicate[] {
  if (!Array.isArray(predicates)) {
    errors.push({ path, message: "must be an array" });
    return [];
  }

  const parsed: RulePredicate[] = [];
  for (let i = 0; i < predicates.length; i += 1) {
    const predicate = predicates[i];
    const itemPath = `${path}[${i}]`;
    if (!isObject(predicate)) {
      errors.push({ path: itemPath, message: "must be an object" });
      continue;
    }
    if (!nonEmpty(predicate.attribute)) {
      errors.push({ path: `${itemPath}.attribute`, message: "is required" });
    }
    if (!nonEmpty(predicate.operator)) {
      errors.push({ path: `${itemPath}.operator`, message: "is required" });
    }
    if (!("value" in predicate)) {
      errors.push({ path: `${itemPath}.value`, message: "is required" });
    }
    if (nonEmpty(predicate.attribute) && nonEmpty(predicate.operator) && "value" in predicate) {
      parsed.push({
        attribute: predicate.attribute,
        operator: predicate.operator as RulePredicate["operator"],
        value: predicate.value
      });
    }
  }

  return parsed;
}

export function validateFlagInput(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  if (!isObject(value)) {
    return { valid: false, errors: [{ path: "flag", message: "must be an object" }] };
  }

  if (!nonEmpty(value.tenantId)) {
    errors.push({ path: "tenantId", message: "is required" });
  }
  if (!nonEmpty(value.key)) {
    errors.push({ path: "key", message: "is required" });
  }
  if (!nonEmpty(value.name)) {
    errors.push({ path: "name", message: "is required" });
  }

  if (!isObject(value.variants) || Object.keys(value.variants).length === 0) {
    errors.push({ path: "variants", message: "must be a non-empty object" });
  }

  if (!nonEmpty(value.fallthroughVariant)) {
    errors.push({ path: "fallthroughVariant", message: "is required" });
  } else if (isObject(value.variants) && !(value.fallthroughVariant in value.variants)) {
    errors.push({ path: "fallthroughVariant", message: "must reference an existing variant" });
  }

  if (!Array.isArray(value.rules)) {
    errors.push({ path: "rules", message: "must be an array" });
  } else {
    for (let i = 0; i < value.rules.length; i += 1) {
      const rule = value.rules[i];
      const path = `rules[${i}]`;
      if (!isObject(rule)) {
        errors.push({ path, message: "must be an object" });
        continue;
      }
      if (!nonEmpty(rule.id)) {
        errors.push({ path: `${path}.id`, message: "is required" });
      }
      if (!nonEmpty(rule.name)) {
        errors.push({ path: `${path}.name`, message: "is required" });
      }
      validatePredicates(rule.conditions, `${path}.conditions`, errors);

      if (!nonEmpty(rule.variant)) {
        errors.push({ path: `${path}.variant`, message: "is required" });
      } else if (isObject(value.variants) && !(rule.variant in value.variants)) {
        errors.push({ path: `${path}.variant`, message: "must reference an existing variant" });
      }

      if (typeof rule.rolloutPercentage === "number") {
        if (rule.rolloutPercentage < 0 || rule.rolloutPercentage > 100) {
          errors.push({ path: `${path}.rolloutPercentage`, message: "must be between 0 and 100" });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateSegmentInput(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  if (!isObject(value)) {
    return { valid: false, errors: [{ path: "segment", message: "must be an object" }] };
  }

  if (!nonEmpty(value.tenantId)) {
    errors.push({ path: "tenantId", message: "is required" });
  }
  if (!nonEmpty(value.key)) {
    errors.push({ path: "key", message: "is required" });
  }
  if (!nonEmpty(value.name)) {
    errors.push({ path: "name", message: "is required" });
  }
  validatePredicates(value.conditions, "conditions", errors);
  return { valid: errors.length === 0, errors };
}

export function validateEnvironmentInput(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  if (!isObject(value)) {
    return { valid: false, errors: [{ path: "environment", message: "must be an object" }] };
  }

  if (!nonEmpty(value.tenantId)) {
    errors.push({ path: "tenantId", message: "is required" });
  }
  if (!nonEmpty(value.key)) {
    errors.push({ path: "key", message: "is required" });
  }
  if (!nonEmpty(value.name)) {
    errors.push({ path: "name", message: "is required" });
  }
  return { valid: errors.length === 0, errors };
}

export function coerceFlag(value: unknown): FeatureFlag {
  const obj = value as FeatureFlag;
  return {
    tenantId: obj.tenantId,
    key: obj.key,
    name: obj.name,
    description: obj.description,
    enabled: Boolean(obj.enabled),
    variants: obj.variants,
    fallthroughVariant: obj.fallthroughVariant,
    rules: obj.rules,
    version: Number(obj.version) || 1,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
}

export function coerceSegment(value: unknown): Segment {
  return value as Segment;
}

export function coerceEnvironment(value: unknown): Environment {
  return value as Environment;
}
