package com.example.demo.service;

import com.example.demo.model.Order;
import com.example.demo.model.Product;
import com.example.demo.notification.service.NotificationService;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.PaymentRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.PractitionerProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final PaymentRepository paymentRepository;
    private final PractitionerProfileRepository practitionerProfileRepository;
    private final NotificationService notificationService;

    public OrderService(OrderRepository orderRepository,
                        ProductRepository productRepository,
                        PaymentRepository paymentRepository,
                        PractitionerProfileRepository practitionerProfileRepository,
                        NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.paymentRepository = paymentRepository;
        this.practitionerProfileRepository = practitionerProfileRepository;
        this.notificationService = notificationService;
    }

    public Order createOrder(Order order) {
        validate(order);

        Product product = productRepository.findById(order.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + order.getProductId()));

        BigDecimal unitPrice = product.getPrice();
        if (unitPrice == null) {
            throw new IllegalStateException("Product price is missing: " + product.getId());
        }

        order.setTotalAmount(unitPrice.multiply(BigDecimal.valueOf(order.getQuantity())));

        if (product.getPractitionerId() != null) {
            practitionerProfileRepository.findById(product.getPractitionerId()).ifPresent(profile -> {
                BigDecimal current = profile.getBalance() == null ? BigDecimal.ZERO : profile.getBalance();
                profile.setBalance(current.add(order.getTotalAmount()));
                practitionerProfileRepository.save(profile);
            });
        }

        Order saved = orderRepository.save(order);

        String productName = product.getName() == null ? "product" : product.getName();
        String message = "Order placed: " + productName + " (Qty " + saved.getQuantity() + ") for INR "
            + saved.getTotalAmount() + ".";
        notificationService.createNotification(saved.getUserId(), "ORDER_PLACED", message);

        return saved;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public void deleteAllOrders() {
        paymentRepository.deleteAll();
        orderRepository.deleteAll();
    }

    public void deleteOrder(Long orderId, Long userId) {
        if (orderId == null) {
            throw badRequest("Order ID is required");
        }
        if (userId == null) {
            throw badRequest("User ID is required");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found: " + orderId));

        if (!userId.equals(order.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Order does not belong to the user");
        }

        paymentRepository.deleteByOrderId(orderId);
        orderRepository.delete(order);
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private void validate(Order order) {
        if (order.getUserId() == null) {
            throw new IllegalArgumentException("User ID is required");
        }
        if (order.getProductId() == null) {
            throw new IllegalArgumentException("Product ID is required");
        }
        if (order.getQuantity() == null || order.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be > 0");
        }
        if (isBlank(order.getAddressLine1())) {
            throw new IllegalArgumentException("Address line 1 is required");
        }
        if (isBlank(order.getCity())) {
            throw new IllegalArgumentException("City is required");
        }
        if (isBlank(order.getState())) {
            throw new IllegalArgumentException("State is required");
        }
        if (isBlank(order.getPostalCode())) {
            throw new IllegalArgumentException("Postal code is required");
        }
        if (isBlank(order.getCountry())) {
            throw new IllegalArgumentException("Country is required");
        }
        if (isBlank(order.getPhone())) {
            throw new IllegalArgumentException("Phone is required");
        }
        String phone = order.getPhone().replaceAll("\\D", "");
        if (phone.length() < 10) {
            throw new IllegalArgumentException("Phone must be at least 10 digits");
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
