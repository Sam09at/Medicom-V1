# Core Concepts & Best Practices

## 1. Error Handling Philosophies

**Exceptions vs Result Types:**
*   **Exceptions:** Traditional try-catch, disrupts control flow. Use for unexpected errors or exceptional conditions.
*   **Result Types:** Explicit success/failure, functional approach. Use for expected errors and validation failures.
*   **Error Codes:** C-style, requires high discipline.
*   **Option/Maybe Types:** Best for representing nullable or absent values instead of arbitrary nulls.
*   **Panics/Crashes:** Best used for unrecoverable errors and strict programming bugs.

## 2. Error Categories

*   **Recoverable Errors:** Network timeouts, missing files, invalid user input, API rate limits. These should be caught and managed via fallbacks or retries.
*   **Unrecoverable Errors:** Out of memory, stack overflow, severe programming bugs (null pointer, etc.). Allow the application string to crash and log effectively.

---

## Best Practices

*   **Fail Fast:** Validate inputs early and fail quickly before resources are wasted.
*   **Preserve Context:** Always include stack traces, metadata, and timestamps to aid in debugging.
*   **Meaningful Messages:** Explain exactly what happened and provide context on how it can be fixed.
*   **Log Appropriately:** Only log actual errors. Do not spam logs with expected failures (like a failed login attempt due to a bad password).
*   **Handle at Right Level:** Catch exceptions only in places where you have enough context to meaningfully handle them or present them to the user.
*   **Clean Up Resources:** Use `try-finally`, context managers, or `defer` to ensure files and connections do not leak.
*   **Don't Swallow Errors:** Either log or re-throw an error. Do not silently ignore it.
*   **Type-Safe Errors:** Use typed errors when possible to avoid generic strings.

### Good Error Handling Example
```python
def process_order(order_id: str) -> Order:
    """Process order with comprehensive error handling."""
    try:
        # Validate input (Fail Fast)
        if not order_id:
            raise ValidationError("Order ID is required")

        # Fetch order
        order = db.get_order(order_id)
        if not order:
            raise NotFoundError("Order", order_id)

        # Process payment
        try:
            payment_result = payment_service.charge(order.total)
        except PaymentServiceError as e:
            # Log and wrap external service error (Preserve Context)
            logger.error(f"Payment failed for order {order_id}: {e}")
            raise ExternalServiceError(
                f"Payment processing failed",
                service="payment_service",
                details={"order_id": order_id, "amount": order.total}
            ) from e

        # Update order
        order.status = "completed"
        order.payment_id = payment_result.id
        db.save(order)

        return order

    except ApplicationError:
        # Re-raise known application errors
        raise
    except Exception as e:
        # Log unexpected errors
        logger.exception(f"Unexpected error processing order {order_id}")
        raise ApplicationError(
            "Order processing failed",
            code="INTERNAL_ERROR"
        ) from e
```

---

## Common Pitfalls

*   **Catching Too Broadly:** `except Exception` indiscriminately hides bugs.
*   **Empty Catch Blocks:** Silently swallowing errors with `pass` or empty brackets ensures errors fall into a black hole.
*   **Logging and Re-throwing:** Creates duplicate log entries everywhere up the stack. Pick one: handle/log it, OR re-throw it.
*   **Not Cleaning Up:** Forgetting to close network connections or file descriptors on failure.
*   **Poor Error Messages:** Logging "An error occurred" does not help the developer fix it.
*   **Returning Error Codes:** Outdated practice; rely on exceptions or Result types in modern languages.
*   **Ignoring Async Errors:** Unhandled promise rejections can cause silent failures or process crashes.
