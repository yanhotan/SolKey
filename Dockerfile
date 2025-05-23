FROM rust:1.82

# Install Solana CLI
RUN sh -c "$(curl -sSfL https://release.solana.com/v1.18.13/install)" && \
    echo 'export PATH="/root/.local/share/solana/install/active_release/bin:$PATH"' >> /root/.bashrc

# Install AVM (Anchor Version Manager)
RUN curl -sSfL https://raw.githubusercontent.com/coral-xyz/anchor/main/scripts/install-avm.sh | bash

# Set ENV paths
ENV PATH="/root/.local/share/solana/install/active_release/bin:/root/.cargo/bin:/root/.avm/bin:$PATH"

# Install Anchor CLI 0.30.1 via avm
RUN /root/.avm/bin/avm install 0.30.1 && /root/.avm/bin/avm use 0.30.1

# Set working directory
WORKDIR /project

# Default command
CMD [ "bash" ]
