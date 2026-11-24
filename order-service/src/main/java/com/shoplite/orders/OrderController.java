
package com.shoplite.orders;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.boot.web.client.RestTemplateBuilder;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping
public class OrderController {

    private final OrderRepository orderRepository;
    private final RestTemplate restTemplate;

    @Value("${catalog.url}")
    private String catalogUrl;

    @Value("${inventory.url}")
    private String inventoryUrl;

    public OrderController(
            OrderRepository orderRepository,
            RestTemplateBuilder builder) {
        this.orderRepository = orderRepository;
        this.restTemplate = builder.build();
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getOrders() {
        return ResponseEntity.ok(orderRepository.findAll());
    }

    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(@RequestBody OrderRequest request) {
        try {
            if (request.product_id() == null ||
                request.quantity() == null ||
                request.quantity() <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid product ID or quantity"));
            }

            // 1. Get product information from Catalog
            JsonNode product = restTemplate.getForObject(
                    catalogUrl + "/products/" + request.product_id(),
                    JsonNode.class);

            if (product == null || !product.has("price")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Product not found"));
            }

            BigDecimal price = new BigDecimal(product.get("price").asText());

            // 2. Check available stock from Inventory
            JsonNode stock = restTemplate.getForObject(
                    inventoryUrl + "/stock/" + request.product_id(),
                    JsonNode.class);

            if (stock == null ||
                stock.get("quantity").asInt() < request.quantity()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Insufficient stock"));
            }

            // 3. Reserve the stock
            Map<String, Integer> reservation = Map.of(
                    "product_id", request.product_id(),
                    "quantity", request.quantity());

            restTemplate.postForEntity(
                    inventoryUrl + "/stock/reserve",
                    reservation,
                    String.class);

            // 4. Save the order in PostgreSQL
            ShopOrder order = new ShopOrder();
            order.setProductId(request.product_id());
            order.setQuantity(request.quantity());
            order.setTotalPrice(price.multiply(
                    BigDecimal.valueOf(request.quantity())));
            order.setStatus("confirmed");

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(orderRepository.save(order));

        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("error", "Catalog or Inventory request failed"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Unable to create order"));
        }
    }

    public record OrderRequest(Integer product_id, Integer quantity) {
    }
}

