library ieee;
use ieee.std_logic_1164.all;

entity mealy_fsm is
    port (
        clk, rst, upDw : in std_logic;
        count : out std_logic_vector(3 downto 0)
    );
end mealy_fsm;

architecture behavioral of mealy_fsm is
    type state_type is (S0, S1, S2, S3);
    signal curr_state, next_state : state_type;

begin
    state_reg : process(clk, rst)
    begin
        if rst = '1' then
            curr_state <= S0;
        elsif rising_edge(clk) then
            curr_state <= next_state;
        end if;
    end process;

    comb_logic : process(curr_state, upDw)
    begin
        next_state <= curr_state;
        case curr_state is
            when S0 =>
                if upDw = '0' then
                    next_state <= S3;
                    count <= "0000";
                else
                    next_state <= S1;
                    count <= "0001";
                end if;
            when S1 =>
                if upDw = '0' then
                    next_state <= S0;
                    count <= "0000";
                else
                    next_state <= S2;
                    count <= "0010";
                end if;
            when S2 =>
                if upDw = '0' then
                    next_state <= S1;
                else
                    next_state <= S3;
                    count <= "0011";
                end if;
                count <= "0001";
            when S3 =>
                if upDw = '0' then
                    next_state <= S2;
                    count <= "0010";
                else
                    next_state <= S0;
                    count <= "0000";
                end if;
            when others =>
                next_state <= S0;
                count <= "0000";
        end case;
    end process;

end behavioral;